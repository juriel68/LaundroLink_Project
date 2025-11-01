import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/conversations/:userId", async (req, res) => {
    const { userId } = req.params;
    
    console.log(`[BACKEND] Attempting to fetch conversations for UserID: ${userId}`);
    
    try {
        const query = `
SELECT
    c.ConversationID AS conversationId,
    c.UpdatedAt AS time,
    
    -- 1. Calculate the Partner ID directly (aliased as partnerId)
    IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID) AS partnerId,
    
    -- 2. Use COALESCE to get the name from either Customers or Staffs
    COALESCE(
        cu.CustName, 
        st.StaffName
    ) AS name,

    -- 3. Get the last message text or image (Subquery remains the same)
    (
        SELECT 
            CASE 
                WHEN m.MessageText IS NOT NULL AND m.MessageText != '' THEN m.MessageText
                WHEN m.MessageImage IS NOT NULL AND m.MessageImage != '' THEN '📷 Photo'
                ELSE ''
            END
        FROM Messages m
        WHERE m.ConversationID = c.ConversationID 
        ORDER BY m.CreatedAt DESC 
        LIMIT 1
    ) AS lastMessage,

    -- 4. Count unread messages (Subquery remains the same)
    (
        SELECT COUNT(*) 
        FROM Messages m 
        WHERE m.ConversationID = c.ConversationID 
            AND m.ReceiverID = ? 
            AND m.MessageStatus = 'Delivered'
    ) AS unreadCount

FROM Conversations c
-- 5. LEFT JOIN to Customers table using the partner ID logic in the ON clause
LEFT JOIN Customers cu ON cu.CustID = IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID)
    
-- 6. LEFT JOIN to Staffs table using the same partner ID logic in the ON clause
LEFT JOIN Staffs st ON st.StaffID = IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID)

-- 7. Filter conversations involving the current user
WHERE c.Participant1_ID = ? OR c.Participant2_ID = ?
ORDER BY c.UpdatedAt DESC;
        `;

        // The query now has 6 '?' placeholders:
        // 1. partnerId calculation: 1st IF
        // 2. unreadCount subquery: ReceiverID
        // 3. Customer join ON: 1st IF
        // 4. Staff join ON: 1st IF
        // 5. WHERE clause: P1
        // 6. WHERE clause: P2
        
        const cleanBindings = [
            userId, // 1. partnerId IF condition
            userId, // 2. unreadCount ReceiverID
            userId, // 3. Customer JOIN ON condition
            userId, // 4. Staff JOIN ON condition
            userId, // 5. WHERE P1
            userId  // 6. WHERE P2
        ];

        const [conversations] = await db.query(query, cleanBindings);
        
        console.log(`[BACKEND] Found ${conversations.length} conversations for UserID: ${userId}`);
        if (conversations.length > 0) {
            console.log("[BACKEND] Sample conversation data:", conversations[0]);
        }

        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});



/**
 * ✅ [NEW & EFFICIENT] Fetch message history for a conversation.
 * This is much faster because it looks up by ConversationID.
 */
router.get("/history/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  try {
    const query = `
      SELECT
        MessageID as id,
        ConversationID as conversationId,
        SenderID as senderId, 
        ReceiverID as receiverId, 
        MessageText as text, 
        MessageImage as image, 
        CreatedAt as time, 
        MessageStatus as status
      FROM Messages
      WHERE ConversationID = ?
      ORDER BY CreatedAt ASC;
    `;
    const [messages] = await db.query(query, [conversationId]);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching message history:", error);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
});


router.post("/", async (req, res) => {
  const { senderId, receiverId, text, image } = req.body;
  if (!senderId || !receiverId || (!text && !image)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Standardize participant order (lowest ID first) to prevent duplicate conversations
    const participant1 = senderId < receiverId ? senderId : receiverId;
    const participant2 = senderId < receiverId ? receiverId : senderId;

    // Step 1: Find or Create the Conversations
    let [[conversation]] = await db.query(
      "SELECT ConversationID FROM Conversations WHERE Participant1_ID = ? AND Participant2_ID = ?",
      [participant1, participant2]
    );

    let conversationId;
    if (conversation) {
      conversationId = conversation.ConversationID;
    } else {
      conversationId = `CONV${Date.now().toString().slice(-7)}`;
      await db.query(
        "INSERT INTO Conversations (ConversationID, Participant1_ID, Participant2_ID, UpdatedAt) VALUES (?, ?, ?, NOW())",
        [conversationId, participant1, participant2]
      );
    }

    // Step 2: Insert the new message
    const newMessageId = `MSG${Date.now().toString().slice(-7)}`;
    await db.query(
      `INSERT INTO Messages 
        (MessageID, ConversationID, SenderID, ReceiverID, MessageText, MessageImage, CreatedAt, MessageStatus) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Sent')`,
      [newMessageId, conversationId, senderId, receiverId, text || null, image || null]
    );

    // Step 3: Update the conversation's timestamp
    await db.query(
      "UPDATE Conversations SET UpdatedAt = NOW() WHERE ConversationID = ?",
      [conversationId]
    );

    // Step 4: Return the newly created message
    const [[newMessage]] = await db.query("SELECT * FROM Messages WHERE MessageID = ?", [newMessageId]);
    res.status(201).json(newMessage);

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});


/**
 * ✅ [NEW] Mark messages in a conversation as read.
 */
router.patch("/read", async (req, res) => {
  const { conversationId, userId } = req.body; // userId is the person reading the messages
  if (!conversationId || !userId) {
    return res.status(400).json({ error: "Conversations ID and User ID are required" });
  }
  try {
    await db.query(
      "UPDATE Messages SET MessageStatus = 'Read' WHERE ConversationID = ? AND ReceiverID = ? AND MessageStatus = 'Delivered'",
      [conversationId, userId]
    );
    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to update message status" });
  }
});


export default router;
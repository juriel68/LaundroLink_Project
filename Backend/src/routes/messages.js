import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * ✅ [UPDATED] Fetch conversation list for a user.
 * Shows "📷 Photo" if the last message was an image.
 */
router.get("/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT
        c.ConversationID AS conversationId,
        c.UpdatedAt AS time,
        -- Find the other participant's ID
        IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID) AS partnerId,
        -- Get the other participant's name
        u.CustName AS name,
        -- Get the last message text or image
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
        -- Count unread messages for this user in this conversation
        (
          SELECT COUNT(*) 
          FROM Messages m 
          WHERE m.ConversationID = c.ConversationID 
            AND m.ReceiverID = ? 
            AND m.MessageStatus = 'Delivered'
        ) AS unreadCount
      FROM Conversations c
      JOIN Customer u 
        ON u.CustID = IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID)
      WHERE c.Participant1_ID = ? OR c.Participant2_ID = ?
      ORDER BY c.UpdatedAt DESC;
    `;

    const [conversations] = await db.query(query, [userId, userId, userId, userId, userId]);
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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Monitor Activity</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #cce5ff;
            margin: 0;
            padding: 40px;
        }

        .container {
            background: #fff;
            border-radius: 12px;
            max-width: 800px;
            margin: 0 auto;
            padding: 25px 30px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
            color: #0077b6;
            font-size: 24px;
            margin-bottom: 5px;
        }

        p {
            color: #555;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #0077b6;
            color: #fff;
            font-weight: 600;
        }

        tr:hover {
            background-color: #f2f6ff;
        }

        .activity {
            color: #333;
        }

        .time {
            color: #555;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>Monitor Activity</h2>
    <p>Track user actions and activity logs within the system.</p>

    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>User</th>
                <th>Activity</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="time">2025-10-17 14:32</td>
                <td>MJ Dimpas</td>
                <td class="activity">Logged in</td>
            </tr>
            <tr>
                <td class="time">2025-10-17 14:35</td>
                <td>Jasper Bulac</td>
                <td class="activity">Updated shop owner information</td>
            </tr>
            <tr>
                <td class="time">2025-10-17 14:38</td>
                <td>Kezhea Dela Cruz</td>
                <td class="activity">Created new staff account</td>
            </tr>
            <tr>
                <td class="time">2025-10-17 14:42</td>
                <td>Juriel Gulane</td>
                <td class="activity">Processed a customer order</td>
            </tr>
            <tr>
                <td class="time">2025-10-17 14:45</td>
                <td>Anna Rose</td>
                <td class="activity">Logged out</td>
            </tr>
        </tbody>
    </table>
</div>

</body>
</html>

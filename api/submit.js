export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
        return res.status(500).json({ error: 'Notion API Key or Database ID is missing' });
    }

    try {
        const { name, phone, email, type, message } = req.body;

        // 노션 API 전송
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    "고객명": {
                        title: [
                            { text: { content: name || '' } }
                        ]
                    },
                    "전화번호": {
                        rich_text: [
                            { text: { content: phone || '' } }
                        ]
                    },
                    "이메일": {
                        rich_text: [
                            { text: { content: email || '' } }
                        ]
                    },
                    "문의 형태": {
                        multi_select: [
                            { name: type }
                        ]
                    },
                    "문의내용": {
                        rich_text: [
                            { text: { content: message || '' } }
                        ]
                    }
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Notion API Error:', data);
            return res.status(response.status).json({ error: 'Failed to save data to Notion', details: data });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

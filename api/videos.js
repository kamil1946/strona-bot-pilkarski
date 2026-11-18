module.exports = async function (req, res) {
    const channels = [
        { name: 'Serie A (Oficjalny)', league: 'SA', id: 'UCBJeMCIeLQos7wacox4hmLQ', keywords: ['highlights', 'sintesi', 'gol'] },
        { name: 'Bundesliga (Oficjalny)', league: 'BL', id: 'UC6UL29enLNe4mqwTfAyeNuw', keywords: ['highlights', 'goals', 'matchday'] },
        { name: 'LaLiga (Oficjalny)', league: 'LL', id: 'UCTv-XvfzLX3i4IGWAm4sbmA', keywords: ['highlights', 'resumen', 'gol'] },
        { name: 'Ligue 1 (Oficjalny)', league: 'OTHER', id: 'UC58_wzhiIMdzHuszHvqsAdc', keywords: ['highlights', 'résumé', 'buts'] },
        { name: 'CANAL+ SPORT', league: 'PL', id: 'UCB7O0i756f7R21-5K599p7g', keywords: ['skrót', 'bramki', 'gole', 'highlights'] }
    ];

    try {
        const requests = channels.map(async (ch) => {
            try {
                const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
                if (!response.ok) return [];
                const xml = await response.text();

                const entries = xml.split('<entry>').slice(1, 10);
                const parsed = [];

                for (const entry of entries) {
                    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
                    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
                    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

                    if (idMatch && titleMatch) {
                        const title = titleMatch[1]
                            .replace(/&amp;/g, '&')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'");
                        const lowerTitle = title.toLowerCase();

                        const isHighlight = ch.keywords.some(kw => lowerTitle.includes(kw));
                        if (isHighlight) {
                            parsed.push({
                                videoId: idMatch[1],
                                title: title,
                                channel: ch.name,
                                league: ch.league,
                                published: publishedMatch ? publishedMatch[1] : new Date().toISOString()
                            });
                        }
                    }
                }
                return parsed;
            } catch (e) {
                return [];
            }
        });

        const results = await Promise.all(requests);
        const allVideos = results
            .flat()
            .sort((a, b) => new Date(b.published) - new Date(a.published))
            .slice(0, 8);

        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return res.status(200).json(allVideos);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

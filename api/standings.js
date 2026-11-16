module.exports = async function (req, res) {
    const { league = 'PL' } = req.query;
    const API_KEY = 'ca55c786d1c04de09c04b1d97be37584';

    try {
        const response = await fetch(`https://api.football-data.org/v4/competitions/${league}/standings`, {
            headers: {
                'X-Auth-Token': API_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'Błąd API', details: errorText });
        }

        const data = await response.json();
        const standings = data.standings[0]?.table || [];

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(standings);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

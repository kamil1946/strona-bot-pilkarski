module.exports = async function (req, res) {
    const API_KEY = 'ca55c786d1c04de09c04b1d97be37584';

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 2);
    const toDate = new Date(now);
    toDate.setDate(now.getDate() + 10);

    const dateFrom = fromDate.toISOString().split('T')[0];
    const dateTo = toDate.toISOString().split('T')[0];

    try {
        const url = `https://api.football-data.org/v4/matches?competitions=PL,PD,SA,BL1,CL&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': API_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'Błąd API', details: errorText });
        }

        const data = await response.json();
        const matches = data.matches || [];

        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        return res.status(200).json(matches);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

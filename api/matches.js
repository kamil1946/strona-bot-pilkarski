module.exports = async function (req, res) {
    const API_KEY = 'ca55c786d1c04de09c04b1d97be37584';

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);

    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = future.toISOString().split('T')[0];

    try {
        const response = await fetch(
            `https://api.football-data.org/v4/matches?competitions=PL,PD,BL1,SA,FL1,CL,WC,EC&dateFrom=${dateFrom}&dateTo=${dateTo}`,
            {
                headers: { 'X-Auth-Token': API_KEY }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Błąd pobierania meczów' });
        }

        const data = await response.json();
        const matches = data.matches || [];

        res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
        return res.status(200).json(matches);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

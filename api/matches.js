module.exports = async function (req, res) {
    const API_KEY = 'ca55c786d1c04de09c04b1d97be37584';
    const leagues = ['PL', 'PD', 'SA', 'BL1', 'CL'];

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
    const toDate = new Date(now);
    toDate.setDate(now.getDate() + 21);

    const dateFrom = fromDate.toISOString().split('T')[0];
    const dateTo = toDate.toISOString().split('T')[0];

    try {
        const requests = leagues.map(code =>
            fetch(`https://api.football-data.org/v4/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
                headers: { 'X-Auth-Token': API_KEY }
            }).then(r => r.ok ? r.json() : { matches: [] })
        );

        const results = await Promise.all(requests);
        const allMatches = results
            .flatMap(data => data.matches || [])
            .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(allMatches);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

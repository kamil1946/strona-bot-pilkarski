let cachedMatches = [];
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minut

module.exports = async function (req, res) {
    const API_KEY = 'ca55c786d1c04de09c04b1d97be37584';
    const nowMs = Date.now();

    if (cachedMatches.length > 0 && (nowMs - lastCacheTime) < CACHE_TTL_MS) {
        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
        return res.status(200).json(cachedMatches);
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
    const toDate = new Date(now);
    toDate.setDate(now.getDate() + 21);

    const dateFrom = fromDate.toISOString().split('T')[0];
    const dateTo = toDate.toISOString().split('T')[0];

    try {
        // 1. Próba pobrania jednym zapytaniem zbiorczym (oszczędza limit 10 req/min)
        const bulkUrl = `https://api.football-data.org/v4/matches?competitions=PL,PD,SA,BL1,CL&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const bulkRes = await fetch(bulkUrl, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        let allMatches = [];

        if (bulkRes.ok) {
            const bulkData = await bulkRes.json();
            allMatches = bulkData.matches || [];
        } else {
            // 2. Fallback: sekwencyjne pobranie z krótkim odstępem, jeśli endpoint zbiorczy zwróci błąd
            const leagues = ['PL', 'PD', 'SA', 'BL1', 'CL'];
            for (const code of leagues) {
                const r = await fetch(`https://api.football-data.org/v4/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
                    headers: { 'X-Auth-Token': API_KEY }
                });
                if (r.ok) {
                    const data = await r.json();
                    if (Array.isArray(data.matches)) {
                        allMatches.push(...data.matches);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }

        if (allMatches.length > 0) {
            allMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
            cachedMatches = allMatches;
            lastCacheTime = nowMs;
        }

        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
        return res.status(200).json(cachedMatches.length > 0 ? cachedMatches : allMatches);
    } catch (error) {
        if (cachedMatches.length > 0) {
            return res.status(200).json(cachedMatches);
        }
        return res.status(500).json({ error: error.message });
    }
};

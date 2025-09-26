import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.main(async () => {
    const input = await Actor.getInput() || {};
    const startUrls = input.startUrls || [
        { url: 'https://www.cva-auctions.co.uk/auctions' }
    ];

    console.log('🚀 Starting crawler with startUrls:', startUrls);

    const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page, request, enqueueLinks, pushData, log }) => {
            log.info(`🌍 Opened page: ${request.url}`);

            // If this is the auction list page → enqueue auction detail pages
            if (request.url.includes('/auctions')) {
                await enqueueLinks({
                    selector: 'a.auction-btn',
                    label: 'DETAIL',
                });
                return;
            }

            // On auction detail pages → scrape vehicles
            if (request.url.includes('/auction/')) {
                const listings = await page.$$('.listing');
                log.info(`📦 Found ${listings.length} listings on ${request.url}`);

                for (const el of listings) {
                    try {
                        const data = {
                            title: await el.$eval('h2, h3', el => el.innerText.trim()).catch(() => null),
                            regNumber: await el.$eval('table tr:nth-child(1) td', el => el.innerText.trim()).catch(() => null),
                            make: await el.$eval('table tr:nth-child(2) td', el => el.innerText.trim()).catch(() => null),
                            model: await el.$eval('table tr:nth-child(3) td', el => el.innerText.trim()).catch(() => null),
                            bodyType: await el.$eval('table tr:nth-child(4) td', el => el.innerText.trim()).catch(() => null),
                            manufactured: await el.$eval('table tr:has(th:has-text("Manufactured")) td', el => el.innerText.trim()).catch(() => null),
                            mileage: await el.$eval('table tr:has(th:has-text("Mileage")) td', el => el.innerText.trim()).catch(() => null),
                            location: await el.$eval('table tr:has(th:has-text("Location")) td', el => el.innerText.trim()).catch(() => null),
                            vendor: await el.$eval('p.subtitle', el => el.innerText.trim()).catch(() => null),
                            description: await el.$eval('p:last-of-type', el => el.innerText.trim()).catch(() => null),
                            imageUrl: await el.$eval('.listing-img img', el => el.getAttribute('src')).catch(() => null),
                            detailsUrl: request.url,
                        };

                        await pushData(data);
                    } catch (err) {
                        log.error(`❌ Failed to extract listing on ${request.url}`, { error: err.message });
                    }
                }
            }
        },
        maxRequestsPerCrawl: 50, // prevent runaway
        headless: true,
    });

    await crawler.run(startUrls);

    console.log('✅ Crawler finished successfully.');
});

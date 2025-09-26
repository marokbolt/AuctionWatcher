import { PlaywrightCrawler } from 'crawlee';

const startUrls = [process.env.START_URL || 'https://www.cva-auctions.co.uk/auctions'];

const crawler = new PlaywrightCrawler({
    requestHandler: async ({ page, request, enqueueLinks, log, pushData }) => {
        log.info(`Scraping: ${request.url}`);

        // If this is the /auctions list page → enqueue auction links
        if (request.url.includes('/auctions')) {
            await enqueueLinks({
                selector: 'a.auction-btn',
                globs: ['https://www.cva-auctions.co.uk/auction/**']
            });
            return;
        }

        // On auction detail pages → scrape vehicles
const listings = await page.$$('.listing');
log.info(`Found ${listings.length} listings on ${request.url}`);

for (const [i, el] of listings.entries()) {
    const data = {
        title: await el.$eval('h2, h3', el => el.innerText.trim()).catch(() => null),
        regNumber: await el.$eval('tr:nth-child(1) td', el => el.innerText.trim()).catch(() => null),
        make: await el.$eval('tr:nth-child(2) td', el => el.innerText.trim()).catch(() => null),
        model: await el.$eval('tr:nth-child(3) td', el => el.innerText.trim()).catch(() => null),
        bodyType: await el.$eval('tr:nth-child(4) td', el => el.innerText.trim()).catch(() => null),
        manufactured: await el.$eval('tr:nth-child(5) td', el => el.innerText.trim()).catch(() => null),
        mileage: await el.$eval('tr:nth-child(6) td', el => el.innerText.trim()).catch(() => null),
        location: await el.$eval('tr:nth-child(7) td', el => el.innerText.trim()).catch(() => null),
        vendor: await el.$eval('p:has-text("Vendor")', el => el.innerText.trim()).catch(() => null),
        description: await el.$eval('.listing-info p:last-of-type', el => el.innerText.trim()).catch(() => null),
        imageUrl: await el.$eval('.listing-img img', el => el.getAttribute('src')).catch(() => null),
        detailsUrl: request.url
    };

    log.info(`Scraped listing #${i + 1} on ${request.url}: ${data.title || 'No title'}`);
    await pushData(data);
}


        // Handle pagination
        await enqueueLinks({
            selector: 'a.page-link',
            globs: ['https://www.cva-auctions.co.uk/auction/**?page=*']
        });
    }
});

// Run crawler
crawler.run(startUrls);

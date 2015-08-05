import urllib
import urllib2
from datetime import date
from pymongo import MongoClient
import requests
from BeautifulSoup import BeautifulSoup as bs
from BeautifulSoup import Tag as BsTag
DEBUG = True
if DEBUG:
    from pprint import pprint
    def dprint(object):
        pprint(object)
else:
    def dprint(object):
        pass

mongodb_host = 'localhost'
mongodb_port = 27017
http_port = 8888
version = '0.0.1'

# TODO: Add logic around not crashing if unavailable
db = MongoClient(mongodb_host, mongodb_port).beer


class BeerStatistics(object):
    def __init__(self):
        self.beers_updated = []
        self.beers_created = []
        self.beers_removed = []
        self.beers_total = 0


class Beer(object):
    FAILURE = -1
    SUCCESS = 1

    def __init__(self):
        self.fields = {
                'sku':'',
                'name':'',
                'image':'',
                'price':'',
                'quantity':'',
                'region':'',
                'description':'',
                'date_added':None,
                'discontinued':False,
                'discontinued_date':None
                }

    def obtain_page(self, loc):
        # Obtain LC Page
        req = urllib2.Request(loc)
        dprint('{{ Retrieving page %s' % loc)
        try:
            lc_resp = urllib2.urlopen(req)
            return lc_resp.read()
        except urllib2.URLError as e:
            print("Error: %s" % e.reason)
            raise e
        dprint('}} complete page %s' % loc)

    def beer_update(self, loc=None, fn_retrieval=None, db=None):
        if not loc:
            loc = (
                'http://www.liquormarts.ca/search-products?items_per_page=100'
                '&mode=list_mode&f[0]=field_category_type%25%25%25%3A1428'
                '&f[1]=field_category_type%25%3A1428'
                '&f[2]=field_category_type%3A1428'
                )
        beer_sku_list = []
        stats = BeerStatistics()
        # used later to see what sku's are no longer offered
        old_beer_sku_list = [x['sku'] for x in
                db.beers.find({'discontinued':False}, {'sku': 1})]

        lc_page = self.obtain_page(loc)

        soup = bs(lc_page)

        # Get number of beers on page
        beer_count = int(soup.find('div', {'class':'view-header'})\
                .text.split(' ')[-1])

        # Beers can only be obtained in groups of 100. Go through each page
        # of 100 beers
        for index in range(0, (beer_count/100)+1):
            # Add page number for subsequent page requests
            if index > 0:
                try:
                    page = self.obtain_page('%s&page=%s' % (loc, index))
                except Exception as e:
                    # TODO: Log appropriately
                    print 'error: %s' % unicode(e)
                    return
                soup = bs(page)
            products = soup.find('ul', {'class':'product-list'})
            if products is None:
                # TODO: Log appropriately
                print 'error: %s - %s' % (loc, index)
                # TODO: Investigate return error 500 or something similiar
                return
            # go through each beer
            for beer in products.contents:
                sku = None
                if type(beer) is BsTag:
                    sku=unicode(beer.findAll('a')[1].text)
                    # If sku not present in db, add it
                    # Otherwise lets upsert
                    bname = beer.find('h4').text,
                    bimage = beer.find('img')['src'],
                    bprice = beer.findAll('div')[2].text,
                    bquantity = beer.findAll('div')[3].text,
                    bregion = beer.findAll('div')[4].text,
                    bdescription = beer.findAll('div')[6].text,
                    bdate_added = date.today().isoformat(),
                    beer_sku_list.append(sku)
                    if db.beers.find({'sku':sku}).count() > 0:
                        result = db.beers.find_one_and_update(
                                {'sku':sku},
                                {   '$set':
                                    {
                                        'price':bprice,
                                        'discontinued':False,
                                        'discontinued_date':None
                                        }
                                    }
                                )
                        stats.beers_updated.append(sku)
                        #if DEBUG:
                            #print "sku %s updated" % sku
                    else:
                        # TODO: below should be strictly insert
                        result = db.beers.replace_one({'sku':sku},
                                {
                                'sku':sku,
                                'name':beer.find('h4').text,
                                'image':beer.find('img')['src'],
                                'price':beer.findAll('div')[2].text,
                                'quantity':beer.findAll('div')[3].text,
                                'region':beer.findAll('div')[4].text,
                                'description':beer.findAll('div')[6].text,
                                'date_added':date.today().isoformat(),
                                'discontinued':False,
                                'discontinued_date':None
                                },
                            upsert=True)
                        stats.beers_created.append(sku)
                        if DEBUG:
                            print "sku %s inserted" % sku

if __name__ == '__main__':
    b = Beer()
    print "count %s" % b.beer_update(db=db)



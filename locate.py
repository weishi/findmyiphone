import webapp2
import json
from findmyiphone import findMyiPhone
from encoder import encoder
from google.appengine.ext import ndb


class Location(ndb.Model):
    timestamp = ndb.StringProperty(indexed=True)
    info = ndb.StringProperty(indexed=False)

class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-type'] = 'application/json'

        username=self.request.get('u')
        password=self.request.get('p')
        action=self.request.get('action');
       
        result=[]
        enc=encoder(password)

        if action == "getHistory":
            locs=Location.query()
            for loc in locs.fetch():
                entry=enc.decode(loc.info)
                if( "timeStamp" in entry ):
                    result.append(json.loads(entry))
        if action == "clearHistory":
            locs=Location.query()
            for loc in locs.fetch():
                loc.key.delete()
        if action == "getLocation":
            #Check new location
            fmi=findMyiPhone(username, password)
            fmi.login()
            result=fmi.getLocation()
            #store location to local DB
            for device in result:
                if device['location']:
                    timestamp=device['location']['timeStamp']
                    loc=Location()
                    loc.timestamp=str(timestamp)
                    loc.info=enc.encode(json.dumps(result))
                    loc.put()

        self.response.write(json.dumps(result))

class RedirectPage(webapp2.RequestHandler):
    def get(self):
        self.redirect('/www/map.html')

application = webapp2.WSGIApplication([
    ('/locate', MainPage),
    ('/',RedirectPage)
    ], debug=True)

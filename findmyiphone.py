import mechanize
import urllib
import json


class findMyiPhone:
    
    loginURL='https://setup.icloud.com/setup/ws/1/login?'
    serviceURL='https://p02-fmipweb.icloud.com/fmipservice/client/web/refreshClient?'
    uid='A24703893FAF930269AA864AFEB91445F6EF0C02'
    clientId='F1195CA9-D5CD-4177-B306-FC84C61522C2'
    headers=[
            ('user-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.3) Gecko/20100423 Ubuntu/10.04 (lucid) Firefox/3.6.3'),
            ('accept', '*/*'),
            ('Connection', 'keep-alive'),
            ('Origin','https://www.icloud.com'),
            ('Referer','https://www.icloud.com')]

    def __init__(self, _username, _password):
        br=mechanize.Browser()
        #br.set_proxies(proxies={'https': '192.168.1.5:8888'},proxy_bypass=lambda hostname: False)
        br.addheaders = findMyiPhone.headers
        self.br=br
        self.username=_username
        self.password=_password
        self.loggedIn=False

    def login(self):
        loginParams={
                'clientBuildNumber': '1P.78541',
                'clientId': findMyiPhone.clientId
                }
        loginData={
            "apple_id": self.username,
            "password": self.password,
            "id": findMyiPhone.uid,
            "extended_login": False
            }
        rsp=self.request(findMyiPhone.loginURL, loginParams, loginData)
        userInfo=json.loads(rsp.read())
        print userInfo
        dsid=userInfo['dsInfo']['dsid']
        print dsid
        self.dsid=dsid
        self.loggedIn=True

    def getLocation(self):
        if(not self.loggedIn):
            raise Exception("Must log in first")
        
        serviceParams={
            'clientBuildNumber': '1P42',
            'clientId': findMyiPhone.clientId,
            'dsid': self.dsid,
            'id': findMyiPhone.uid
            }
        serviceData={"clientContext":{
            "appName":"iCloud Find (Web)",
            "appVersion":"2.0",
            "timezone":"America/New_York",
            "inactiveTime":1084803,
            "apiVersion":"3.0",
            "webStats":"0:15"}
            }
        rsp=self.request(findMyiPhone.serviceURL, serviceParams, serviceData)
        deviceInfo=json.load(rsp)
        resultList=[]
        for device in deviceInfo['content']:
            resultEntry={}
            resultEntry['name']=device['name']
            resultEntry['location']=device['location']
            resultList.append(resultEntry)

        return resultList
    
    def request(self, host, params, data):
        request=findMyiPhone.buildURL(host, params)
        rsp=self.br.open(request, json.dumps(data))
        return rsp

    @staticmethod
    def buildURL(host, params):
        url= host+urllib.urlencode(params)
        return url


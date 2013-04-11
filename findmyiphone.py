import mechanize
import urllib
import json


class findMyiPhone:
    
    loginURL='https://setup.icloud.com/setup/ws/1/login?'
    serviceURL='https://p10-fmipweb.icloud.com/fmipservice/client/web/refreshClient?'
    uid='038BC12FCB69916F0D95D3FECD61E449AC0E1092'
    clientId='5834333E-A2FE-4D75-A5F0-DB6EBF3DBC7A'
    headers=[
            ('Accept-Charset', 'ISO-8859-1,utf-8;q=0.7,*;q=0.3'),
            #('Accept-Encoding', 'gzip,deflate,sdch'),
            ('Accept-Language', 'en-US,en;q=0.8'),
            ('user-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.3) Gecko/20100423 Ubuntu/10.04 (lucid) Firefox/3.6.3'),
            ('accept', '*/*'),
            ('Connection', 'keep-alive'),
            ('Content-Type', 'text/plain'),
            ('Origin','https://www.icloud.com'),
            ('Referer','https://www.icloud.com')]

    def __init__(self, _username, _password):
        br=mechanize.Browser()
        br.set_proxies(proxies={'https': '192.168.1.5:8888'},proxy_bypass=lambda hostname: False)
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
        dsid=userInfo['dsInfo']['dsid']
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


from itertools import izip, cycle
import base64

class encoder:
    
    def __init__(self, key):
        self.key=key

    def decode(self,data):
        data = base64.decodestring(data)
        tmp= ''.join(chr(ord(x) ^ ord(y)) for (x,y) in izip(data, cycle(self.key)))
        return tmp

    def encode(self,data):
        tmp= ''.join(chr(ord(x) ^ ord(y)) for (x,y) in izip(data, cycle(self.key)))
        return base64.encodestring(tmp).strip()

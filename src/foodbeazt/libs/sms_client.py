from time import strftime,gmtime,time
import urllib.request
import urllib.parse
import hmac
import hashlib
import base64
import logging
import json

class SmsClient(object):
  def __init__(self, access_key, private_key, sns_host='sns.us-east-1.amazonaws.com', subject='F00DBEAZT'):
    self.sns_host = sns_host
    self.subject = subject
    self.access_key = access_key
    self.private_key = private_key
    self.log = logging.getLogger(__name__)
    self.enabled = access_key is not None and private_key is not None \
                  and len(access_key) > 0 and len(private_key) > 0

  def send(self, phoneno, message):
    if self.enabled == False:
      self.log.warning("AWS SMS Client disabled!")
      return
    phoneno = "+91%s" % (phoneno)
    params = {
              'Subject' : self.subject,
              'PhoneNumber': phoneno,
              'Message' : message,
              'MessageStructure': 'string',
              'Timestamp' : strftime("%Y-%m-%dT%H:%M:%S.000Z", gmtime(time())),
              'AWSAccessKeyId' : self.access_key,
              'Action' : 'Publish',
              'SignatureVersion' : '2',
              'SignatureMethod' : 'HmacSHA256',
              }
    try:
      cannqs=str.join('&', ["%s=%s"%(urllib.parse.quote(key),urllib.parse.quote(params[key], safe='-_~')) \
                                    for key in sorted(params.keys())])
      string_to_sign=str.join('\n', ["GET",self.sns_host,"/",cannqs]).encode('utf-8')
      digest = hmac.new(self.private_key.encode('utf-8'),string_to_sign,digestmod=hashlib.sha256).digest()
      sig=base64.b64encode(digest)
      url="http://%s/?%s&Signature=%s"%(self.sns_host,cannqs,urllib.parse.quote(sig))

      headers = {"Accept": "application/json"}
      req = urllib.request.Request(url, None, headers)
      with urllib.request.urlopen(req) as res:
        response = res.read().decode('utf-8')
        data = json.loads(response)
        result = data.get('PublishResponse', None)
        if result and 'PublishResult' in result and 'MessageId' in result['PublishResult']:
          return result['PublishResult']['MessageId']
        else:
          self.log.warn("Got invalid response from AWS SNS [%s]" % response)
    except Exception as e:
      self.log.exception(e)

    return None

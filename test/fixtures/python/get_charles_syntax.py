import requests

headers = {
    'Host': 'api.ipify.org',
    'Accept': '*/*',
    'User-Agent': 'GiftTalk/2.7.2 (iPhone; iOS 9.0.2; Scale/3.00)',
    'Accept-Language': 'en-CN;q=1, zh-Hans-CN;q=0.9',
}

params = {
    'format': 'json',
}

response = requests.get('http://localhost:28139/', headers=headers, params=params)

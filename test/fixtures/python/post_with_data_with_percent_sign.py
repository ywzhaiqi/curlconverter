import requests

headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
}

data = 'secret=*%5*!'

response = requests.post('https://localhost:28139/post', headers=headers, data=data)

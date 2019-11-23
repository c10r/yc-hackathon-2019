import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("account_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

data = {
    u'url': u'https://twitter.com/chander/status/1035927454131650560',
    u'donation_amount': u'.30',
}

# Add a new doc in collection 'cities' with ID 'LA'
db.collection(u'donations').document().set(data)
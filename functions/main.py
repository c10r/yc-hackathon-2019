import firebase_admin
from flask import escape


cred = firebase_admin.credentials.Certificate("account_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def hello_world(request):
    data = {
        u'url': u'https://twitter.com/chander/status/1035927454131650560',
        u'donation_amount': u'.30',
    }

    # Add a new doc in collection 'cities' with ID 'LA'
    db.collection(u'donations').document().set(data)
    return 'Hello World!'


def hello_http(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
        <http://flask.pocoo.org/docs/1.0/api/#flask.Request>
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
        <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>.
    """
    request_json = request.get_json(silent=True)
    request_args = request.args

    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']
    else:
        name = 'World'
    return 'Hello {}!'.format(escape(name))

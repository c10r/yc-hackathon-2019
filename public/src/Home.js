import React from 'react';
import Card from 'react-bootstrap/Card';

const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9najuwXPdie8oVeEmtswbUCvJPqoLh-g",
    authDomain: "credz-io.firebaseapp.com",
    databaseURL: "https://credz-io.firebaseio.com",
    projectId: "credz-io",
    storageBucket: "credz-io.appspot.com",
    messagingSenderId: "2399915251",
    appId: "1:2399915251:web:37a1bc80f6594550e87b86",
    measurementId: "G-CN2KBYDFT9"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.firestore()

const cardStyle = {
    margin: '40px',
    border: '1px solid gray'
};

const cardTextStyle = {
    fontSize: '20px',
};

const cardSubtitleTextStyle = {
    fontSize: '10px',
};

class DonationList extends React.Component {
    render() {
        const items = this.props.donations.map((donation, index) => {
            return (
                <Card style={cardStyle}>
                    <Card.Title><a href={donation.url}>{donation.url}</a></Card.Title>
                    <Card.Text style={cardTextStyle}>
                        <p>🤑${(donation.amount / 100.0).toFixed(2)}</p>
                        <p>{donation.message}</p>
                        <p style={cardSubtitleTextStyle}>{new String(donation.ts.toDate())}</p>
                    </Card.Text>
                </Card>
            )
        })
        return (
            <ul>{items}</ul>
        )
    }
}

class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = { donations: [] }
        this.getLatestDonations = this.getLatestDonations.bind(this)

        this.getLatestDonations()
    }

    getLatestDonations() {
        db.collection('donations')
            .orderBy('ts', 'desc')
            .onSnapshot(querySnapshot => {
                const data = querySnapshot.docs.map(doc => doc.data())
                this.setState({ donations: data })
            })
    }

    render() {
        return (
            <div>
                <h2>Reward content the way you see fit.</h2>
                <DonationList donations={this.state.donations} />
            </div>
        )
    }
}

export default Home;
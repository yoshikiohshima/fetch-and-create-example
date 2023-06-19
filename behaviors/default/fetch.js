// Copyright 2022 by Croquet Corporation, Inc. All Rights Reserved.
// https://croquet.io
// info@croquet.io

/*

This module manages a list of recent values from a bitcoin position
server. It is used with the Elected module, so that one of
participants is chosen to fetch values.

*/

class FetchExampleActor {
    setup() {
        this.listen("history", "history");
    }

    history(data) {
        if (this.boxes) {
            this.boxes.forEach((box) => box.destroy())
        }
        this.boxes = [];

        let number = parseInt(data);
        let even = number % 2 === 0;

        console.log(number, even);

        this.boxes.push(this.createCard({
            type: "object",
            parent: this,
            behaviorModules: ["Click", "Box"],
            translation: [-1, 0.5, 0.1],
            color: 0x22ff22
        }));

        if (even) {
            this.boxes.push(this.createCard({
                type: "object",
                parent: this,
                behaviorModules: ["Click", "Box"],
                translation: [1, 0.5, 0.1],
                color: 0x2222ff
            }));
        }
    }

    addCard(data) {
        console.log(data);
    }
}

class FetchExamplePawn {
    setup() {
        // Those two messages are sent from the Elected module.
        // When handleElected is sent, it signifies that it newly becomes a leader.
        // When handleUnelected is sent, it signifies that it is not a leader anymore.
        this.listen("handleElected", "handleElected");
        this.listen("handleUnelected", "handleUnelected");

        // Upon start up, this message query the current status from the Elected module.
        this.say("electionStatusRequested");

        this.setupPlane();
    }

    /*
      When data is undefined, it is a result from electionStatusRequested.
      When data and data.to is filled with the elected viewId.
    */
    handleElected(data) {
        if (!data || data.to === this.viewId) {
            console.log("this view is elected");
            this.fetchHistory();
        }
    }

    /*
      When this peer is unelected.
    */
    handleUnelected() {
    }

    setupPlane() {
        let {THREE} = Microverse;

        if (this.box) {
            this.box.geometry.dispose();
            this.box.material.dispose();
            this.box.removeFromParent();
        }

        let geometry = new THREE.BoxGeometry(2, 1, 0.05);
        let material = new THREE.MeshBasicMaterial({color: 0x4d4d4d});
        this.box = new THREE.Mesh(geometry, material);

        this.shape.add(this.box);
    }

    /*
      At the initialization time, we fetch more data via an http end point.
    */
    fetchHistory() {
        console.log("Fetching BTC-USD history from Coinbase...");
        return fetch(`https://api.coinbase.com/v2/prices/BTC-USD/historic?period=day`).then((response) => {
            return response.json();
        }).then((json) => {
            const prices = json.data.prices;
            let last = prices[prices.length - 1];
            this.say("history", last.price);
        });
    }
}

class ClickActor {
    setup() {
        this.addEventListener("pointerDown", "removeClickActor");
    }

    removeClickActor() {
        this.removeBehaviorModule("Click");
        this.say("setColor", 0xff2222);
    }

    teardown() {
        console.log("tear down ClickActor");
        this.removeEventListener("pointerDown", "removeClickActor");
    }
}

class BoxPawn {
    setup() {
        this.listen("setColor", "setColor");
        this.setColor(this.actor._cardData.color);
    }

    setColor(color) {
        let {THREE} = Microverse;

        if (this.box) {
            this.box.geometry.dispose();
            this.box.material.dispose();
            this.box.removeFromParent();
        }

        let geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        let material = new THREE.MeshBasicMaterial({color});
        this.box = new THREE.Mesh(geometry, material);

        this.shape.add(this.box);
    }
}

export default {
    modules: [
        {
            name: "FetchExample",
            actorBehaviors: [FetchExampleActor],
            pawnBehaviors: [FetchExamplePawn],
        },
        {
            name: "Box",
            pawnBehaviors: [BoxPawn]
        },
        {
            name: "Click",
            actorBehaviors: [ClickActor]
        }
    ]
}

/* globals Microverse */

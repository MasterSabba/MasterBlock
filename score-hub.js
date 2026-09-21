(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyBxZQF5OO5-znaipaPYeFcjOARjFXO1_gc",
        authDomain: "mastersabba-games.firebaseapp.com",
        databaseURL: "https://mastersabba-games-default-rtdb.firebaseio.com",
        projectId: "mastersabba-games",
        storageBucket: "mastersabba-games.firebasestorage.app",
        messagingSenderId: "254141019232",
        appId: "1:254141019232:web:29702c03b91f8a76677f05"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const database = firebase.database();

    window.MasterSabbaScore = {
        auth,
        database,

        getCurrentUser() {
            return auth.currentUser;
        },

        onAuthReady(callback) {
            return auth.onAuthStateChanged(callback);
        },

        async awardPoints({
            gameId,
            points,
            win = false,
            gameCount = 1
        }) {
            const user = auth.currentUser;

            if (!user) {
                console.warn("Punti non accreditati: utente non autenticato.");
                return {
                    success: false,
                    reason: "NOT_AUTHENTICATED"
                };
            }

            if (!gameId) {
                throw new Error("gameId mancante.");
            }

            if (!Number.isFinite(points) || points < 0 || points > 1000) {
                throw new Error("Numero di punti non valido.");
            }

            const uid = user.uid;
            const userRef = database.ref(`users/${uid}`);
            const snapshot = await userRef.once("value");
            const current = snapshot.val() || {};

            const currentTotalXP = Number(current.totalXP || 0);
            const currentGamesPlayed = Number(current.gamesPlayed || 0);

            const currentGame =
                current.gameScores &&
                current.gameScores[gameId]
                    ? current.gameScores[gameId]
                    : {};

            const currentGamePoints = Number(currentGame.points || 0);
            const currentGameWins = Number(currentGame.wins || 0);
            const currentGamePlayed = Number(currentGame.gamesPlayed || 0);

            const timestamp = firebase.database.ServerValue.TIMESTAMP;

            const updates = {};

            updates[`users/${uid}/totalXP`] = currentTotalXP + points;
            updates[`users/${uid}/gamesPlayed`] =
                currentGamesPlayed + gameCount;
            updates[`users/${uid}/lastActivityAt`] = timestamp;

            updates[`users/${uid}/gameScores/${gameId}/points`] =
                currentGamePoints + points;

            updates[`users/${uid}/gameScores/${gameId}/wins`] =
                currentGameWins + (win ? 1 : 0);

            updates[`users/${uid}/gameScores/${gameId}/gamesPlayed`] =
                currentGamePlayed + gameCount;

            updates[`users/${uid}/gameScores/${gameId}/lastPlayedAt`] =
                timestamp;

            await database.ref().update(updates);

            return {
                success: true,
                uid,
                gameId,
                points,
                totalXP: currentTotalXP + points
            };
        }
    };
})();

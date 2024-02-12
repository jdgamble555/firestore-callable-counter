import { onCall } from 'firebase-functions/v2/https';
import { https } from 'firebase-functions/v2';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

if (!getApps.length) {
    initializeApp();
}

const db = firestore();

const todoChange = (request: https.CallableRequest) => {

    if (!request.auth) {
        throw new https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = request.auth.uid;

    const create = !!request.data.text;

    return db.runTransaction(async (transaction) => {

        // get current doc collection count
        const docCountQuery = db.collection('todos').count();
        const docCountDoc = await transaction.get(docCountQuery);

        // get current user doc count
        const userCountQuery = db
            .collection('todos')
            .where('uid', '==', uid)
            .count();
        const userCountDoc = await transaction.get(userCountQuery);

        // create or delete todo
        if (create) {
            const todoRef = db.collection('todos').doc();
            transaction.create(todoRef, {
                uid,
                text: request.data.text,
                complete: false,
                createdAt: FieldValue.serverTimestamp()
            });
        } else {
            const todoRef = db.doc('todos/' + request.data.id);
            transaction.delete(todoRef);
        }
        const i = create ? 1 : -1;

        // update doc count
        const countRef = db.doc('_counters/todos');
        transaction.set(countRef, {
            count: docCountDoc.data().count + i
        }, { merge: true });

        // update user doc count
        const userRef = db.doc('users/' + uid);
        transaction.set(userRef, {
            todoCount: userCountDoc.data().count + i
        }, { merge: true });
    });
}

export const addTodo = onCall(todoChange);
export const deleteTodo = onCall(todoChange);

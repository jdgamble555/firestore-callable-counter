// Todos

import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from "firebase/firestore";

import { writable, type Subscriber } from "svelte/store";
import { db, functions } from "./firebase";
import { httpsCallable } from "firebase/functions";

export const getTodos = (uid: string) => writable<Todo[] | null>(
    null,
    (set: Subscriber<Todo[] | null>) =>
        onSnapshot(
            query(
                collection(db, 'todos'),
                where('uid', '==', uid),
                orderBy('createdAt')
            ), (q) => {
                set(q.empty
                    ? []
                    : q.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Todo[]
                );
            })
);

export const getTotalTodos = () => writable<number>(0, (set: Subscriber<number>) =>
    onSnapshot(
        doc(db, '_counters/todos'),
        (q) => set(q.exists() ? q.data().count : 0)
    )
);

export const getTotalUserTodos = (uid: string) => writable<number>(0, (set: Subscriber<number>) =>
    onSnapshot(
        doc(db, `users/${uid}`),
        (q) => set(q.exists() ? q.data().todoCount : 0)
    )
);

export const addTodo = async (text: string) => {

    httpsCallable(functions, 'addTodo')({
        text
    });
};

export const updateTodo = (id: string, newStatus: boolean) => {
    updateDoc(doc(db, 'todos', id), { complete: newStatus });
}

export const deleteTodo = (id: string) => {

    httpsCallable(functions, 'deleteTodo')({
        id
    });
};


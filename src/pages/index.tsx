import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { MutableRefObject, createContext, memo, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
const inter = Inter({ subsets: ['latin'] })

//forbidden - in server 
export let qwe = {
  test: 2
};

// server: req => getServerSideProps => props => ssrRender => (Html + props)
// client: Html + props => clientRender => Hydration

export const getServerSideProps = (async (context) => {
  const users = { a: 1, b: { test: 'hi' }, c: 3 };
  return { props: { users } }
}) satisfies GetServerSideProps<{
}>

type ServerSideProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const createStore = <T,>(t: T) => {
  const store = {
    data: t,
    state: 'Success' as 'Success' | 'Loading',
    callbacks: [] as (() => void)[],
  };

  const change = (data: any) => {
    store.data = data;

    for (let i of store.callbacks) {
      i();
    }
  };

  const subscribe = (onChange: any) => {
    store.callbacks = [...store.callbacks, onChange];
    return () => {
      store.callbacks = store.callbacks.filter(x => x !== onChange);
    }
  }

  const useSelector = <TResult,>(selector: (data: T) => TResult) => useSyncExternalStore(
    subscribe,
    () => selector(store.data),
    () => selector(store.data))

  return { useSelector, change, data: store.data };
}

type Store = ReturnType<typeof createStore<ServerSideProps['users']>>;
export const StoreContext = createContext(undefined as any as Store);
export const StoreQueryContext = createContext(undefined as any as Store);

function MyUsers() {
  console.log('rerender MyUsers');
  const store = useContext(StoreContext);
  const value = store.useSelector(x => x.a);

  return <div>users
    <p>
      {value}
    </p>
  </div>
}

export default function Home({
  users
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log('rerender Home');
  const store = useMemo(() => createStore(users), [users])
  const storeQuery = useMemo(() => createStore([]), [])
  const value = store.useSelector(x => x.b)

  // storeQuery.useQuery(async () => fetch("/"));
  // const fetchResult = storeQuery.useSelector(x => x);

  // const selector = useCallback(x => x.test.qwe, []);  // we dont need it as selector compares output -
  // but the selector function needs to behave the same - like in LSP rule
  // const qwe = useSelector(selector); // we dont need it as 
  // const qwe = useSelector(x => x.test.qwe);


  // b: { "test": "hi" }, value: { "test": "hi" }
  // b: { "test": "bye" }, value: b
  // b:  { "test": "bye" }, value: b + rerender
  //

  return (
    <StoreContext.Provider value={store}>
      <StoreQueryContext.Provider value={store}>
        <Head>
          <title>Create Next App</title>
          <meta name="description" content="Generated by create next app" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className={`${styles.main} ${inter.className}`}>
          <div style={{ display: "flex", flexDirection: 'column', flex: 1, height: "100vh" }}>
            <MyUsers />
            <Image
              className={styles.logo}
              style={{ flex: 1 }}
              src="/next.svg"
              alt="Next.js Logo"
              width={180}
              height={37}
              priority
            />
            <button
              onClick={() => {
                store.change({
                  ...store.data,
                  b: { test: 'bye' },
                  c: Math.random(),
                });
              }}
              style={{ flex: 1, width: "100px", height: "100px" }}>Click me!</button>
            <button
              onClick={() => {
                store.change({
                  ...store.data,
                  a: Math.random(),
                  c: 4
                });
              }}
              style={{ flex: 1, width: "100px", height: "100px" }}>Same identity</button>
            <p
              style={{ flex: 1 }}
            >{JSON.stringify(value, undefined, '\n')}</p>
          </div>

        </main>
      </StoreQueryContext.Provider>
    </StoreContext.Provider>
  )
}

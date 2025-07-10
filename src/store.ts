import { createStore, applyMiddleware, compose } from "redux";
import createSagaMiddleware from "redux-saga";
import sagas from "./sagas";
import { createRootReducer } from "./reducers";

const sagaMiddleware = createSagaMiddleware();

// Enable Redux DevTools only in development
const composeEnhancers =
  (typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const configureStore = (initialState?: any): ReturnType<typeof createStore> => {
  const store = createStore(
    createRootReducer,
    initialState,
    composeEnhancers(applyMiddleware(sagaMiddleware))
  );
  sagaMiddleware.run(sagas);
  return store;
};

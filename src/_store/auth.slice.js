import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { alertActions } from '_store';
import { history, fetchWrapper } from '_helpers';

// create slice

const name = 'auth';

const initialState = createInitialState();
const reducers = createReducers();
const extraActions = createExtraActions();

const extraReducers = createExtraReducers();

const slice = createSlice({ name, initialState, reducers, extraReducers });

// exports

export const authActions = { ...slice.actions, ...extraActions };
export const authReducer = slice.reducer;

// implementation

function createInitialState() {
    return {
        // initialize state from local storage to enable user to stay logged in
        user: JSON.parse(localStorage.getItem('user')),
        error: null
    }
}


// 18-01-2026 - Needed in extraActions
function createReducers() {

    return {

        // Needed in extraActions
        setAuth

    };

    function setAuth(state, action) {
        state.value = action.payload;
    }
}

function createExtraActions() {

    const baseUrl = `${process.env.REACT_APP_API_URL}/users`;

    return {
        login: login(),
        logout: logout()
    };
        
    function logout() {

        console.log("Logging out + refresh page...");

        return createAsyncThunk(
            `${name}/logout`,
            function (arg, { dispatch }) {
                dispatch(authActions.setAuth(null));
                localStorage.removeItem('user');
                history.navigate('/login');

                // 18-01-2026 - temp fix a bug with reload due to a issue after logout
                window.location.reload();
            }

        );

    }


    function login() {

        return createAsyncThunk(

            `${name}/login`,

            async function ({ username, password }, { dispatch }) {

                dispatch(alertActions.clear());

                try {

                    const user = await fetchWrapper.post(`${baseUrl}/authenticate`, { username, password });

                    //console.log( "U / P: " + username, password );  
                    console.log("User: " + JSON.stringify(user));

                    // add basic auth header to user object for future requests                    
                    user.authdata = window.btoa(username + ':' + password);

                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('user', JSON.stringify(user));

                    // set auth user in redux state
                    dispatch(authActions.setAuth(user));

                    // get return url from location state or default to home page
                    const { from } = history.location.state || { from: { pathname: '/' } };
                    history.navigate(from);

                    // 18-01-2026 - temp fix a bug with reload due to a issue after login
                    window.location.reload();


                } catch (error) {

                    console.log("Error: " + error);

                    // 19-01-2026 - Maybe not needed here 
                    // Removed dispatching alert here
                    // dispatch(alertActions.error(error));

                    // 19-01-2026 - Changed to throw error to be catched in 
                    // extraReducers + displayed as alert by alert.slice.js
                    throw error;

                }

            }
        );
    }


}

// 19-01-2026 - Used only for catching errors from extraActions login to be displayed by alert.slice.js
// at Login.jsx when a User types wrong credentials  
function createExtraReducers() {

    return (builder) => {

        login();

        function login() {
            var { pending, fulfilled, rejected } = extraActions.login;
            builder
                .addCase(pending, (state) => {

                    console.log("Pending: Auth ...");

                    state.error = null;
                })
                .addCase(fulfilled, (state, action) => {

                    console.log("Fulfilled: Auth ...");

                })
                .addCase(rejected, (state, action) => {

                    console.log("Rejected: Auth ...");

                    state.error = action.error;
                });
        }
    };
}

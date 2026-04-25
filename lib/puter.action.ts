// import puter from "@heyputer/puter.js";
//
// export const signIn = async() => await puter.auth.signIn();
// export const signOut = async() => puter.auth.signOut();
// export const getCurrentUser = async() => {
//     try{
//         return await puter.auth.getUser();
//     } catch{
//         return null;
//     }
// }

const getPuter = async () => {
    const mod = await import("@heyputer/puter.js");
    return mod.default;
};

export const signIn = async () => {
    const puter = await getPuter();
    return await puter.auth.signIn();
};

export const signOut = async () => {
    const puter = await getPuter();
    return await puter.auth.signOut();
};

export const getCurrentUser = async () => {
    try {
        const puter = await getPuter();
        return await puter.auth.getUser();
    } catch {
        return null;
    }
};
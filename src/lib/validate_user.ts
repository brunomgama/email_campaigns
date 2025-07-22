import {auth0} from "@/lib/auth0";
import {redirect} from "next/navigation";

export const validate_user = async () => {
    const session = await auth0.getSession();
    if (!session) {
        redirect("/auth/login")
    }

    return session;
}
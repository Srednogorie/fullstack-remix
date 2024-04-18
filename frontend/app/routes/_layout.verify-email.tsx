import { redirect, LoaderFunctionArgs } from "@remix-run/node";
import axios from "axios";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
  
    // Access the URL parameters
    const token = params.get('token');

    try {
        await axios.post("/auth/verify", {"token": token}, {
            headers: {"Content-Type": "application/json"}
        })
        // TODO flash the user email to the login page and pre populate the email field
        return redirect('/login');
    } catch (error) {
      // Handle the error
    }
  }

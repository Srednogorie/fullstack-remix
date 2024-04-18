import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
    return [
      { title: 'Confirm email | BeeRich' },
      { name: 'description', content: "We've just sent you confirmation email." },
    ];
  };


export default function Component() {
    return (
      <div>You need too confirm your email, we just sent you an email.</div>
    );
  }
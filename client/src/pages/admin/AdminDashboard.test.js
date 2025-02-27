// Done by Austin
// Declaration: AI assistance (Chatgpt) used for this file, prompts all made by me.

import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../../context/auth";



jest.mock("../../components/AdminMenu", () => () =><div>adminmock123</div>);

jest.mock("../../context/auth", () =>({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({children }) => <div>{children}</div>);


describe("AdminDashboard",() => {
  it("gives correct return val", () => {

    const phonenum = "999";
    const name1 = "Mr CS4218";
    const emailadd = "CS4218@SU.com";

    useAuth.mockReturnValue([{
        user:{
          phone:phonenum,
          name: name1,
          email: emailadd,
        },
      }
    ]);

    render(<AdminDashboard />);

    expect(screen.getByText("adminmock123")).toBeInTheDocument();

    expect(screen.getByText(/Admin Contact/i)).toHaveTextContent(phonenum);
    expect(screen.getByText(/Admin Name/i)).toHaveTextContent(name1);
    expect(screen.getByText(/Admin Email/i)).toHaveTextContent(emailadd);

  });
});

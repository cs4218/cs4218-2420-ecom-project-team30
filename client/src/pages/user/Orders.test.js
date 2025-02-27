//done by austin
//AI declaration: this file was made with the assistance of gen AI (Chatgpt)

import '@testing-library/jest-dom';
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";


jest.mock("../../context/auth", () =>({
  useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", ()=> ({title,children }) => (
    <div>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  ));

jest.mock("../../components/UserMenu", () =>() => <div>UserMenu</div>);
jest.mock("axios");

const apilibpath = "/api/v1/auth/orders"


describe("Orders code",() =>{
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("generates order properly", async() => {

    const buyername = "Mr CS4218";

    const cs4218order = [
      {
        status: "Delivered",
        buyer: { name:buyername },
        createAt:new Date(),
        payment: { success: true },
        products: [
          {
            name: "Applepie",
            _id: "prod1",
            description: "A tasty apple pie.",
            price: 69,
          },
        ],
      },
    ];

    useAuth.mockReturnValue([{ token: "testtoken" },()=> {}]);

    axios.get.mockResolvedValueOnce({data:cs4218order });

    render(<Orders />);
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(apilibpath)
    );

    expect(await screen.findByText("Applepie")).toBeInTheDocument();
    expect(await screen.findByText(buyername)).toBeInTheDocument();
    expect(screen.getByText("Your Orders")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();

    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  test("when payment cannot pass", async () => {
    const buyername = "Mdm CS4218";

    useAuth.mockReturnValue([{ token: "testtoken" }, () => {}]);

    const testorder = [
      {
        buyer: {name:buyername },
        status: "Processing",
        createAt: new Date(),
        payment: { success: false },
        products: [
          {
            _id: "prod2",
            name: "Ice cream",
            description: "Banana ice cream flavour",
            price: 999,
          },
        ],
      },
    ];

    axios.get.mockResolvedValueOnce({ data:testorder });

    render(<Orders />);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(apilibpath)
    );

    expect(await screen.findByText("Ice cream")).toBeInTheDocument();
    expect(await screen.findByText(buyername)).toBeInTheDocument();

    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  test("throw error case", async ()=> {
    const eyeSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    useAuth.mockReturnValue([{ token: "testtoken" }, () => {}]);

    axios.get.mockRejectedValueOnce(new Error("Whole thing broke!"));
    render(<Orders />);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(apilibpath)
    );

    await waitFor(() => {
      expect(eyeSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    eyeSpy.mockRestore();
  });

  test("no auth token", async ()=> {
    useAuth.mockReturnValue([{}, () => {}]);

    render(<Orders />);

    await waitFor(() =>{
      expect(axios.get).not.toHaveBeenCalled();
    });

    expect(screen.getByText("Your Orders")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });


});

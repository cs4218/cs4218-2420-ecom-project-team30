//This file done by Austin
//AI declaration: This code below was supported by the AI tool, chatgpt.com
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "../components/AdminMenu"; 
import "@testing-library/jest-dom";

describe("AdminMenu.js tests", () => {
  let component;

  beforeEach(() => {
    component = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
  });

  test("render adminpanel", () => {
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  test("render bodycontent", () => {
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
   
    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  
  });

  test("correct href for links", () => {
    const expectedLinks = [
      { text: "Products", href: "/dashboard/admin/products" },
      { text: "Orders", href: "/dashboard/admin/orders" },
      { text: "Create Category", href: "/dashboard/admin/create-category" },
      { text: "Create Product", href: "/dashboard/admin/create-product" }
    ];

    expectedLinks.forEach(({ text, href }) => {
      expect(screen.getByText(text).closest("a")).toHaveAttribute("href", href);
    });
  });

  test("does not render users", () => {
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});

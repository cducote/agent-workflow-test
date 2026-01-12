import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/components/Button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies default variant styles", () => {
    render(<Button onClick={() => {}}>Default</Button>);
    const button = screen.getByText("Default");
    expect(button).toHaveClass("bg-claude-accent");
  });

  it("applies primary variant styles", () => {
    render(
      <Button onClick={() => {}} variant="primary">
        Primary
      </Button>
    );
    const button = screen.getByText("Primary");
    expect(button).toHaveClass("bg-claude-primary");
  });

  it("applies fullWidth class when fullWidth is true", () => {
    render(
      <Button onClick={() => {}} fullWidth>
        Full Width
      </Button>
    );
    const button = screen.getByText("Full Width");
    expect(button).toHaveClass("w-full");
  });
});

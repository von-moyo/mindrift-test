import React from 'react';
import { render, screen } from '@testing-library/react';

const SimpleComponent = () => {
  return <div>Hello Test</div>;
};

describe('Simple Component Test', () => {
  it('renders hello text', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});

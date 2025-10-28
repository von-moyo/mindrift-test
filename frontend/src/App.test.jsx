import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  test('renders welcome message', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Wait for the loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.getByRole('status'));

    // Now check for the welcome message
    const welcomeElement = await screen.findByRole('heading', { name: /Welcome to VC Shop/i });
    expect(welcomeElement).toBeInTheDocument();
  });
});

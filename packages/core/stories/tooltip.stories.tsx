import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { Tooltip, TooltipProps } from '../components/Tooltip/Tooltip';

export default {
  title: 'Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    delay: {
      control: { type: 'number', step: 100 },
    },
  },
} satisfies Meta<TooltipProps>;

type Story = StoryObj<TooltipProps>;

function formatDate(date: Date): string {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day.toString().padStart(2, '0')} ${monthNames[monthIndex]} ${year}`;
}

export const Simple: Story = {
  render: args => (
    <>
      <br />
      <br />
      <br />
      <span id="existing-description" hidden>
        Existing description
      </span>
      <Tooltip {...args} aria-describedby="existing-description">
        <span>Hover me</span>
      </Tooltip>
    </>
  ),

  args: {
    delay: 1000,
    text: formatDate(new Date()),
  },
  play: async ({ args, canvas, userEvent }) => {
    const target = canvas.getByText('Hover me');
    const trigger = target.parentElement!;
    const delay = args.delay!;
    const text = args.text!;

    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );

    // the tip shows only after `delay`, while the pointer stays on it
    await userEvent.hover(target);

    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await waitFor(
      () => expect(canvas.getByRole('tooltip')).toHaveTextContent(text),
      { timeout: delay * 2 },
    );
    const hoverPopup = canvas.getByRole('tooltip');
    const hoverDescriptionIds = trigger
      .getAttribute('aria-describedby')
      ?.split(/\s+/);
    await expect(hoverDescriptionIds).toContain('existing-description');
    await expect(hoverDescriptionIds).toContain(hoverPopup.id);

    // leaving hides it
    await userEvent.unhover(target);

    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );

    // and leaving before `delay` cancels it
    await userEvent.hover(target);
    await userEvent.unhover(target);
    await new Promise(resolve => setTimeout(resolve, delay * 1.5));

    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );

    // Escape cancels a hover-triggered show even when focus is elsewhere
    await userEvent.hover(target);
    await userEvent.keyboard('{Escape}');
    await new Promise(resolve => setTimeout(resolve, delay * 1.5));
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );
    await userEvent.unhover(target);

    // blur cancels a focus-triggered show before its delay
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();
    await new Promise(resolve => setTimeout(resolve, delay * 1.5));
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );

    // the wrapper can be reached and described by keyboard alone
    await userEvent.tab({ shift: true });
    await expect(trigger).toHaveFocus();
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await waitFor(
      () => expect(canvas.getByRole('tooltip')).toHaveTextContent(text),
      { timeout: delay * 2 },
    );
    const focusPopup = canvas.getByRole('tooltip');
    const focusDescriptionIds = trigger
      .getAttribute('aria-describedby')
      ?.split(/\s+/);
    await expect(focusDescriptionIds).toContain('existing-description');
    await expect(focusDescriptionIds).toContain(focusPopup.id);

    // tabbing away hides the tip and removes only its description reference
    await userEvent.tab();
    await expect(trigger).not.toHaveFocus();
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );

    // Escape hides a visible tip without moving focus or reopening it
    await userEvent.tab({ shift: true });
    await expect(trigger).toHaveFocus();
    await waitFor(
      () => expect(canvas.getByRole('tooltip')).toHaveTextContent(text),
      { timeout: delay * 2 },
    );
    const escapePopup = canvas.getByRole('tooltip');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(
      'aria-describedby',
      'existing-description',
    );
    await expect(trigger).toHaveFocus();
    await new Promise(resolve => setTimeout(resolve, delay * 1.5));
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
    await expect(escapePopup).not.toBeInTheDocument();
  },

  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/2cbigNitjcruBDZT12ixIq/React95-Design-Kit?node-id=3%3A19',
    },
  },
};

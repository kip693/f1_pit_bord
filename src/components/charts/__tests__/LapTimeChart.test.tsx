import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LapTimeChart } from '../LapTimeChart';
import type { Lap, PitStop, Driver } from '@/lib/api/types';

const mockDrivers: Driver[] = [
  {
    driver_number: 1,
    broadcast_name: 'M VERSTAPPEN',
    full_name: 'Max VERSTAPPEN',
    name_acronym: 'VER',
    team_name: 'Red Bull Racing',
    team_colour: '3671C6',
    first_name: 'Max',
    last_name: 'Verstappen',
    headshot_url: 'https://example.com/ver.png',
    country_code: 'NED',
    session_key: 12345,
    meeting_key: 1234,
  },
];

const mockLaps: Lap[] = [
  {
    date_start: '2024-01-01T10:00:00Z',
    driver_number: 1,
    duration_sector_1: 25.5,
    duration_sector_2: 30.2,
    duration_sector_3: 28.3,
    i1_speed: 310,
    i2_speed: 290,
    is_pit_out_lap: false,
    lap_duration: 84.0,
    lap_number: 1,
    meeting_key: 1234,
    session_key: 12345,
    st_speed: 320,
    segments_sector_1: [2048, 2048],
    segments_sector_2: [2048, 2048],
    segments_sector_3: [2048, 2048],
  },
];

const mockPitStops: PitStop[] = [];

describe('LapTimeChart', () => {
  it('should render empty state when no data', () => {
    render(
      <LapTimeChart
        laps={[]}
        pitStops={[]}
        drivers={[]}
        selectedDrivers={[]}
      />,
    );
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('should render chart with data', () => {
    const { container } = render(
      <LapTimeChart
        laps={mockLaps}
        pitStops={mockPitStops}
        drivers={mockDrivers}
        selectedDrivers={[1]}
      />,
    );
    // Recharts renders a ResponsiveContainer
    expect(container.firstChild).toBeTruthy();
  });
});

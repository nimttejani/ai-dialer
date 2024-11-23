import { POST } from '../route';
import { getAvailability, createBooking } from '@/services/cal';
import { formatAvailabilityForVAPI } from '@/lib/cal';

// Mock the cal service functions
jest.mock('@/services/cal', () => ({
  getAvailability: jest.fn(),
  createBooking: jest.fn(),
}));

// Mock formatAvailabilityForVAPI
jest.mock('@/lib/cal', () => ({
  formatAvailabilityForVAPI: jest.fn(),
}));

describe('VAPI Integration API', () => {
  const mockHeaders = new Headers();
  mockHeaders.set('x-vapi-secret', 'test-key');

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    process.env.VAPI_SECRET_KEY = 'test-key';
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: new Headers(),
        body: JSON.stringify({ action: 'check_availability' }),
      });

      await expect(POST(request)).rejects.toThrow('Unauthorized: Invalid API key');
    });

    it('should reject requests with invalid API key', async () => {
      const wrongHeaders = new Headers();
      wrongHeaders.set('x-vapi-secret', 'wrong-key');

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: wrongHeaders,
        body: JSON.stringify({ action: 'check_availability' }),
      });

      await expect(POST(request)).rejects.toThrow('Unauthorized: Invalid API key');
    });
  });

  describe('check_availability', () => {
    it('should return formatted availability', async () => {
      const mockAvailability = {
        success: true,
        availability: [
          { startTime: '2024-03-20T10:00:00Z', endTime: '2024-03-20T11:00:00Z' },
        ],
      };

      const mockFormattedAvailability = 'Tomorrow at 10:00 AM';

      (getAvailability as jest.Mock).mockResolvedValue(mockAvailability);
      (formatAvailabilityForVAPI as jest.Mock).mockReturnValue(mockFormattedAvailability);

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ action: 'check_availability' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain(mockFormattedAvailability);
      expect(data.availability).toEqual(mockAvailability.availability);
      expect(getAvailability).toHaveBeenCalledWith(5);
    });

    it('should handle no available slots', async () => {
      const mockAvailability = {
        success: true,
        availability: [],
      };

      (getAvailability as jest.Mock).mockResolvedValue(mockAvailability);
      (formatAvailabilityForVAPI as jest.Mock).mockReturnValue('');

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ action: 'check_availability' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain("I don't see any available slots");
    });
  });

  describe('book_appointment', () => {
    const mockBookingDetails = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Inc',
      phone: '123-456-7890',
      startTime: '2024-03-20T10:00:00Z',
      notes: 'Test booking',
    };

    it('should successfully book an appointment', async () => {
      (createBooking as jest.Mock).mockResolvedValue({ success: true });

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({
          action: 'book_appointment',
          bookingDetails: mockBookingDetails,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(createBooking).toHaveBeenCalledWith(mockBookingDetails);
    });

    it('should require booking details', async () => {
      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({
          action: 'book_appointment',
        }),
      });

      await expect(POST(request)).rejects.toThrow();
    });

    it('should require startTime for booking', async () => {
      const bookingWithoutStartTime = { ...mockBookingDetails } as Partial<typeof mockBookingDetails>;
      delete bookingWithoutStartTime.startTime;

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({
          action: 'book_appointment',
          bookingDetails: bookingWithoutStartTime,
        }),
      });

      await expect(POST(request)).rejects.toThrow();
    });

    it('should handle booking failure', async () => {
      const mockError = 'Booking failed: time slot not available';
      (createBooking as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: mockError 
      });

      const request = new Request('http://localhost/api/vapi', {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({
          action: 'book_appointment',
          bookingDetails: mockBookingDetails,
        }),
      });

      await expect(POST(request)).rejects.toThrow(mockError);
    });
  });
});

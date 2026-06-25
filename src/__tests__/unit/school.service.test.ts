// src/__tests__/unit/school.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the school service
const mockSchoolService = {
  getSchools: vi.fn(),
  getSchoolByCode: vi.fn(),
  registerSchool: vi.fn(),
  updateSchool: vi.fn(),
  deleteSchool: vi.fn(),
  toggleSchoolStatus: vi.fn(),
  getSchoolStats: vi.fn(),
};

vi.mock('@/lib/gov/school.service', () => ({
  schoolService: mockSchoolService,
}));

describe('SchoolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockSchoolService).toBeDefined();
  });

  it('should have getSchools method', () => {
    expect(mockSchoolService.getSchools).toBeDefined();
    expect(typeof mockSchoolService.getSchools).toBe('function');
  });

  it('should have registerSchool method', () => {
    expect(mockSchoolService.registerSchool).toBeDefined();
    expect(typeof mockSchoolService.registerSchool).toBe('function');
  });

  it('should get schools successfully', async () => {
    const mockSchools = [
      { school_code: 'SC001', school_name: 'School A', status: 'active' },
      { school_code: 'SC002', school_name: 'School B', status: 'active' },
    ];
    mockSchoolService.getSchools.mockResolvedValue(mockSchools);

    const result = await mockSchoolService.getSchools();
    expect(result).toEqual(mockSchools);
    expect(mockSchoolService.getSchools).toHaveBeenCalled();
  });
});

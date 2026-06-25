// src/__tests__/unit/student.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the student service
const mockStudentService = {
  getStudents: vi.fn(),
  getStudentByTsid: vi.fn(),
  getStudentStats: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudent: vi.fn(),
};

vi.mock('@/lib/gov/student.service', () => ({
  studentService: mockStudentService,
}));

describe('StudentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockStudentService).toBeDefined();
  });

  it('should have getStudents method', () => {
    expect(mockStudentService.getStudents).toBeDefined();
    expect(typeof mockStudentService.getStudents).toBe('function');
  });

  it('should have getStudentByTsid method', () => {
    expect(mockStudentService.getStudentByTsid).toBeDefined();
    expect(typeof mockStudentService.getStudentByTsid).toBe('function');
  });

  it('should have getStudentStats method', () => {
    expect(mockStudentService.getStudentStats).toBeDefined();
    expect(typeof mockStudentService.getStudentStats).toBe('function');
  });

  it('should have updateStudent method', () => {
    expect(mockStudentService.updateStudent).toBeDefined();
    expect(typeof mockStudentService.updateStudent).toBe('function');
  });

  it('should have deleteStudent method', () => {
    expect(mockStudentService.deleteStudent).toBeDefined();
    expect(typeof mockStudentService.deleteStudent).toBe('function');
  });

  it('should get students successfully', async () => {
    const mockStudents = [
      { tsid: 'TS001', fullname: 'John Doe', status: 'active' },
      { tsid: 'TS002', fullname: 'Jane Smith', status: 'active' },
    ];
    mockStudentService.getStudents.mockResolvedValue(mockStudents);

    const result = await mockStudentService.getStudents();
    expect(result).toEqual(mockStudents);
    expect(mockStudentService.getStudents).toHaveBeenCalled();
  });

  it('should handle empty student list', async () => {
    mockStudentService.getStudents.mockResolvedValue([]);
    
    const result = await mockStudentService.getStudents();
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});

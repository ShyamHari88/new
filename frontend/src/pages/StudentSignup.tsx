import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { departments, years, sections } from '@/data/mockData';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

export default function StudentSignup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNumber: '',
        password: '',
        confirmPassword: '',
        departmentId: '1',
        year: 1,
        section: 'C'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.rollNumber || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authService.studentSignup({
                name: formData.name,
                email: formData.email,
                rollNumber: formData.rollNumber,
                password: formData.password,
                departmentId: formData.departmentId,
                year: formData.year,
                section: formData.section,
                currentSemester: (formData.year * 2) - 1
            });

            toast.success('Account created successfully!');
            navigate('/student-dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <Card className="shadow-lg border-0 rounded-lg">
                            <Card.Header className="bg-white border-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Link to="/login" className="btn btn-link text-decoration-none p-0 d-flex align-items-center text-muted">
                                        <ArrowLeft className="me-2" size={16} />
                                        Back to Login
                                    </Link>
                                </div>
                                <div className="text-center mb-4">
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                                            <GraduationCap className="text-primary" size={48} />
                                        </div>
                                    </div>
                                    <h2 className="text-center fw-bold text-dark">Student Sign Up</h2>
                                    <p className="text-muted text-center">Create your student account</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3" controlId="name">
                                        <Form.Label>Full Name *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label>Email *</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="john@student.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="rollNumber">
                                        <Form.Label>Roll Number *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="23IT151"
                                            value={formData.rollNumber}
                                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Row className="mb-3">
                                        <Col xs={6}>
                                            <Form.Group controlId="department">
                                                <Form.Label>Department</Form.Label>
                                                <Form.Select
                                                    value={formData.departmentId}
                                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                                >
                                                    {departments.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>
                                                            {dept.code}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Group controlId="year">
                                                <Form.Label>Year</Form.Label>
                                                <Form.Select
                                                    value={formData.year.toString()}
                                                    onChange={(e) => {
                                                        const newYear = parseInt(e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            year: newYear
                                                        });
                                                    }}
                                                >
                                                    {years.map((y) => (
                                                        <option key={y.value} value={y.value.toString()}>
                                                            {y.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3" controlId="section">
                                        <Form.Label>Section</Form.Label>
                                        <Form.Select
                                            value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        >
                                            {sections.map((s) => (
                                                <option key={s} value={s}>
                                                    Section {s}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="password">
                                        <Form.Label>Password *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="confirmPassword">
                                        <Form.Label>Confirm Password *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                                        {loading ? 'Creating Account...' : 'Sign Up'}
                                    </Button>

                                    <div className="text-center mt-3">
                                        <span className="text-muted small">
                                            Already have an account?{' '}
                                            <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                                                Login here
                                            </Link>
                                        </span>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

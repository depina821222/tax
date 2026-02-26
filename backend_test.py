#!/usr/bin/env python3
import requests
import sys
from datetime import datetime, timedelta

class TaxOfficeAPITester:
    def __init__(self, base_url="https://deploy-ready-126.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_result(self, test_name, success, response_data=None, error_msg=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            self.test_results.append({
                "test": test_name,
                "status": "PASSED",
                "data": response_data
            })
        else:
            print(f"❌ {test_name} - FAILED: {error_msg}")
            self.test_results.append({
                "test": test_name,
                "status": "FAILED",
                "error": error_msg
            })

    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response
        except requests.exceptions.RequestException as e:
            return None

    def test_health_check(self):
        """Test API health endpoint"""
        print("\n🔍 Testing API Health Check...")
        response = self.make_request('GET', 'health', auth_required=False)
        
        if response is None:
            self.log_result("API Health Check", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_result("API Health Check", True, data)
                    return True
                else:
                    self.log_result("API Health Check", False, error_msg=f"Unhealthy status: {data}")
                    return False
            except:
                self.log_result("API Health Check", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("API Health Check", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_login(self, email="admin@taxoffice.com", password="admin123"):
        """Test login endpoint"""
        print(f"\n🔍 Testing Login with {email}...")
        
        response = self.make_request('POST', 'auth/login', {
            'email': email,
            'password': password
        }, auth_required=False)
        
        if response is None:
            self.log_result("Admin Login", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    user_info = data.get('user', {})
                    self.log_result("Admin Login", True, {
                        'email': user_info.get('email'),
                        'role': user_info.get('role'),
                        'full_name': user_info.get('full_name')
                    })
                    return True
                else:
                    self.log_result("Admin Login", False, error_msg="No access_token in response")
                    return False
            except:
                self.log_result("Admin Login", False, error_msg="Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get('detail', 'Login failed')
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Admin Login", False, error_msg=error_detail)
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        print("\n🔍 Testing Dashboard Stats...")
        
        if not self.token:
            self.log_result("Dashboard Stats", False, error_msg="No auth token available")
            return False
            
        response = self.make_request('GET', 'dashboard/stats')
        
        if response is None:
            self.log_result("Dashboard Stats", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                expected_fields = ['total_clients', 'active_clients', 'today_appointments', 'pending_cases']
                
                if all(field in data for field in expected_fields):
                    self.log_result("Dashboard Stats", True, {
                        'total_clients': data.get('total_clients'),
                        'active_clients': data.get('active_clients'),
                        'today_appointments': data.get('today_appointments'),
                        'pending_cases': data.get('pending_cases')
                    })
                    return True
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_result("Dashboard Stats", False, error_msg=f"Missing fields: {missing_fields}")
                    return False
            except:
                self.log_result("Dashboard Stats", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Dashboard Stats", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_services_list(self):
        """Test services endpoint (public)"""
        print("\n🔍 Testing Services List...")
        
        response = self.make_request('GET', 'services?active_only=true', auth_required=False)
        
        if response is None:
            self.log_result("Services List", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    service_count = len(data)
                    sample_service = data[0] if data else None
                    
                    self.log_result("Services List", True, {
                        'service_count': service_count,
                        'sample_service': {
                            'name_en': sample_service.get('name_en') if sample_service else None,
                            'name_es': sample_service.get('name_es') if sample_service else None,
                            'duration_minutes': sample_service.get('duration_minutes') if sample_service else None
                        } if sample_service else None
                    })
                    return True
                else:
                    self.log_result("Services List", False, error_msg="Response is not a list")
                    return False
            except:
                self.log_result("Services List", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Services List", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_brand_settings(self):
        """Test brand settings endpoint (public)"""
        print("\n🔍 Testing Brand Settings...")
        
        response = self.make_request('GET', 'brand', auth_required=False)
        
        if response is None:
            self.log_result("Brand Settings (GET)", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                expected_fields = ['business_name_en', 'business_name_es', 'primary_color', 'accent_color']
                
                if all(field in data for field in expected_fields):
                    self.log_result("Brand Settings (GET)", True, {
                        'business_name_en': data.get('business_name_en'),
                        'business_name_es': data.get('business_name_es'),
                        'primary_color': data.get('primary_color'),
                        'accent_color': data.get('accent_color')
                    })
                    return True
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_result("Brand Settings (GET)", False, error_msg=f"Missing fields: {missing_fields}")
                    return False
            except:
                self.log_result("Brand Settings (GET)", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Brand Settings (GET)", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_brand_settings_update(self):
        """Test brand settings update (admin only)"""
        print("\n🔍 Testing Brand Settings Update...")
        
        if not self.token:
            self.log_result("Brand Settings (PUT)", False, error_msg="No auth token available")
            return False
            
        # Test data
        test_update = {
            'business_name_en': 'Elite Tax Services Test',
            'tagline_en': 'Test Tagline'
        }
        
        response = self.make_request('PUT', 'brand', test_update)
        
        if response is None:
            self.log_result("Brand Settings (PUT)", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('business_name_en') == test_update['business_name_en']:
                    self.log_result("Brand Settings (PUT)", True, {
                        'updated_name': data.get('business_name_en'),
                        'updated_tagline': data.get('tagline_en')
                    })
                    
                    # Restore original value
                    restore_data = {
                        'business_name_en': 'Elite Tax Services',
                        'tagline_en': 'Professional Tax & Business Services'
                    }
                    self.make_request('PUT', 'brand', restore_data)
                    return True
                else:
                    self.log_result("Brand Settings (PUT)", False, error_msg="Update not reflected in response")
                    return False
            except:
                self.log_result("Brand Settings (PUT)", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Brand Settings (PUT)", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_available_slots(self):
        """Test available slots endpoint"""
        print("\n🔍 Testing Available Slots...")
        
        # Test with tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        response = self.make_request('GET', f'appointments/available-slots/{tomorrow}', auth_required=False)
        
        if response is None:
            self.log_result("Available Slots", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'slots' in data:
                    slots = data['slots']
                    self.log_result("Available Slots", True, {
                        'date': tomorrow,
                        'available_slots': len(slots),
                        'sample_slots': slots[:5] if slots else []
                    })
                    return True
                else:
                    self.log_result("Available Slots", False, error_msg="No 'slots' field in response")
                    return False
            except:
                self.log_result("Available Slots", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Available Slots", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_clients_list(self):
        """Test clients list endpoint"""
        print("\n🔍 Testing Clients List...")
        
        if not self.token:
            self.log_result("Clients List", False, error_msg="No auth token available")
            return False
            
        response = self.make_request('GET', 'clients')
        
        if response is None:
            self.log_result("Clients List", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    client_count = len(data)
                    sample_client = data[0] if data else None
                    
                    self.log_result("Clients List", True, {
                        'client_count': client_count,
                        'sample_client': {
                            'full_name': sample_client.get('full_name') if sample_client else None,
                            'status': sample_client.get('status') if sample_client else None,
                            'preferred_language': sample_client.get('preferred_language') if sample_client else None
                        } if sample_client else None
                    })
                    return True
                else:
                    self.log_result("Clients List", False, error_msg="Response is not a list")
                    return False
            except:
                self.log_result("Clients List", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Clients List", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_forgot_password(self):
        """Test forgot password endpoint"""
        print("\n🔍 Testing Forgot Password...")
        
        test_email = "admin@taxoffice.com"
        
        response = self.make_request('POST', 'auth/forgot-password', {
            'email': test_email
        }, auth_required=False)
        
        if response is None:
            self.log_result("Forgot Password", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data:
                    self.log_result("Forgot Password", True, {
                        'email': test_email,
                        'message': data.get('message')
                    })
                    return True
                else:
                    self.log_result("Forgot Password", False, error_msg="No message in response")
                    return False
            except:
                self.log_result("Forgot Password", False, error_msg="Invalid JSON response")
                return False
        else:
            try:
                error_detail = response.json().get('detail', f'HTTP {response.status_code}')
            except:
                error_detail = f"HTTP {response.status_code}"
            self.log_result("Forgot Password", False, error_msg=error_detail)
            return False

    def test_sms_status(self):
        """Test SMS status endpoint"""
        print("\n🔍 Testing SMS Status...")
        
        if not self.token:
            self.log_result("SMS Status", False, error_msg="No auth token available")
            return False
            
        response = self.make_request('GET', 'sms/status')
        
        if response is None:
            self.log_result("SMS Status", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                expected_fields = ['configured', 'service_name']
                
                if all(field in data for field in expected_fields):
                    self.log_result("SMS Status", True, {
                        'configured': data.get('configured'),
                        'service_name': data.get('service_name'),
                        'phone_number': data.get('phone_number', 'Not configured')
                    })
                    return True
                else:
                    # SMS endpoint might not exist yet - let's check if it's a 404
                    self.log_result("SMS Status", False, error_msg=f"Missing expected fields: {data}")
                    return False
            except:
                self.log_result("SMS Status", False, error_msg="Invalid JSON response")
                return False
        elif response.status_code == 404:
            # SMS status endpoint might not be implemented yet
            self.log_result("SMS Status", False, error_msg="SMS status endpoint not found (not implemented)")
            return False
        else:
            self.log_result("SMS Status", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_domain_settings(self):
        """Test domain settings endpoints"""
        print("\n🔍 Testing Domain Settings...")
        
        if not self.token:
            self.log_result("Domain Settings (GET)", False, error_msg="No auth token available")
            return False
            
        # Test GET domain settings
        response = self.make_request('GET', 'domain-settings')
        
        if response is None:
            self.log_result("Domain Settings (GET)", False, error_msg="Connection failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                expected_fields = ['custom_domain', 'domain_verified', 'ssl_status']
                
                if all(field in data for field in expected_fields):
                    self.log_result("Domain Settings (GET)", True, {
                        'custom_domain': data.get('custom_domain'),
                        'domain_verified': data.get('domain_verified'),
                        'ssl_status': data.get('ssl_status')
                    })
                    return True
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_result("Domain Settings (GET)", False, error_msg=f"Missing fields: {missing_fields}")
                    return False
            except:
                self.log_result("Domain Settings (GET)", False, error_msg="Invalid JSON response")
                return False
        else:
            self.log_result("Domain Settings (GET)", False, error_msg=f"HTTP {response.status_code}")
            return False

    def test_domain_verification(self):
        """Test domain verification endpoint"""
        print("\n🔍 Testing Domain Verification...")
        
        if not self.token:
            self.log_result("Domain Verification", False, error_msg="No auth token available")
            return False
            
        # First set a test domain
        test_domain = "test.example.com"
        put_response = self.make_request('PUT', 'domain-settings', {
            'custom_domain': test_domain
        })
        
        if put_response and put_response.status_code == 200:
            # Now test verification
            response = self.make_request('POST', 'domain-settings/verify')
            
            if response is None:
                self.log_result("Domain Verification", False, error_msg="Connection failed")
                return False
                
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_result("Domain Verification", True, {
                        'domain': data.get('custom_domain'),
                        'verified': data.get('domain_verified'),
                        'ssl_status': data.get('ssl_status')
                    })
                    return True
                except:
                    self.log_result("Domain Verification", False, error_msg="Invalid JSON response")
                    return False
            else:
                try:
                    error_detail = response.json().get('detail', f'HTTP {response.status_code}')
                except:
                    error_detail = f"HTTP {response.status_code}"
                self.log_result("Domain Verification", False, error_msg=error_detail)
                return False
        else:
            self.log_result("Domain Verification", False, error_msg="Failed to set test domain")
            return False

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Tax Office CRM API Tests")
        print("=" * 50)
        
        # Core API tests
        self.test_health_check()
        
        # Authentication tests
        login_success = self.test_login()
        
        # P1 Feature: Forgot Password
        self.test_forgot_password()
        
        if login_success:
            # Protected endpoint tests
            self.test_dashboard_stats()
            self.test_clients_list()
            self.test_brand_settings_update()
            
            # P1 Feature: SMS Status
            self.test_sms_status()
            
            # P1 Feature: Domain Settings & Verification
            self.test_domain_settings()
            self.test_domain_verification()
        
        # Public endpoint tests
        self.test_services_list()
        self.test_brand_settings()
        self.test_available_slots()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    print("Tax Office CRM - Backend API Test Suite")
    print("Testing against: https://deploy-ready-126.preview.emergentagent.com/api")
    print()
    
    tester = TaxOfficeAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
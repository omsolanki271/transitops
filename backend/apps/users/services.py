from .models import User

def create_user_service(email, password, full_name, role, phone=None):
    """
    Service function to create a new user.
    """
    return User.objects.create_user(
        email=email,
        password=password,
        full_name=full_name,
        role=role,
        phone=phone
    )

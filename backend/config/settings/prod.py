from .base import *

DEBUG = False

# Production settings can override allowed hosts or database settings
ALLOWED_HOSTS = [x.strip() for x in os.environ.get('ALLOWED_HOSTS', '').split(',') if x.strip()]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': int(os.environ.get('DB_PORT', '3306')),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'NAME': os.environ.get('DB_NAME', 'transitops'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        }
    }
}

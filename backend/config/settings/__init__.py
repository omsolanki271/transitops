import os

# Settings routing inside the package init
settings_env = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

if settings_env == 'config.settings.prod':
    from .prod import *
elif settings_env == 'config.settings.base':
    from .base import *
else:
    from .dev import *

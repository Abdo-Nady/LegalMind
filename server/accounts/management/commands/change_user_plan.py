"""
Management command to change a user's subscription plan
Usage: python manage.py change_user_plan <email> <plan_name>
Example: python manage.py change_user_plan user@example.com premium
"""
from django.core.management.base import BaseCommand
from accounts.models import User
from accounts.models_billing import Plan, Subscription


class Command(BaseCommand):
    help = 'Change a user subscription plan'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')
        parser.add_argument('plan', type=str, choices=['free', 'standard', 'premium'], help='Plan name')

    def handle(self, *args, **options):
        email = options['email']
        plan_name = options['plan']

        try:
            # Get user
            user = User.objects.get(email=email)
            self.stdout.write(f'Found user: {user.email}')

            # Get plan
            plan = Plan.objects.get(name=plan_name)
            self.stdout.write(f'Found plan: {plan.display_name} (${plan.price}/month)')

            # Update subscription
            subscription = user.subscription
            old_plan = subscription.plan.display_name
            subscription.plan = plan
            subscription.save()

            self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully changed {user.email} from {old_plan} to {plan.display_name}!'))
            self.stdout.write(f'\nPlan details:')
            self.stdout.write(f'  - Documents: {"Unlimited" if plan.max_documents is None else plan.max_documents}')
            self.stdout.write(f'  - Messages/Day: {"Unlimited" if plan.max_messages_per_day is None else plan.max_messages_per_day}')
            self.stdout.write(f'  - Egyptian Laws: {"All" if plan.max_egyptian_laws is None else ("None" if plan.max_egyptian_laws == 0 else plan.max_egyptian_laws)}')
            self.stdout.write(f'  - Future Features: {"Yes" if plan.has_future_features else "No"}')

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'✗ User with email "{email}" not found'))
        except Plan.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'✗ Plan "{plan_name}" not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))

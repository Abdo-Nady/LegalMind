from django.core.management.base import BaseCommand
from accounts.models_billing import Plan


class Command(BaseCommand):
    help = 'Seed the database with subscription plans'

    def handle(self, *args, **options):
        self.stdout.write('Seeding subscription plans...')

        plans_data = [
            {
                'name': 'free',
                'display_name': 'Free',
                'price': 0,
                'max_documents': 3,
                'max_messages_per_day': 20,
                'max_egyptian_laws': 0,
                'has_future_features': False,
            },
            {
                'name': 'standard',
                'display_name': 'Standard',
                'price': 25,
                'max_documents': 20,
                'max_messages_per_day': 150,
                'max_egyptian_laws': 2,
                'has_future_features': False,
            },
            {
                'name': 'premium',
                'display_name': 'Premium',
                'price': 99,
                'max_documents': None,  # Unlimited
                'max_messages_per_day': None,  # Unlimited
                'max_egyptian_laws': None,  # All laws
                'has_future_features': True,
            },
        ]

        for plan_data in plans_data:
            plan, created = Plan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.display_name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'→ Updated plan: {plan.display_name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n✓ Successfully seeded all plans!')
        )

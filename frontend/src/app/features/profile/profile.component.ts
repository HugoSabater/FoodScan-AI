import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
    profileForm!: FormGroup;
    saveSuccess = false;
    saveError = false;

    /** Available diet options */
    readonly dietOptions = [
        { value: 'omnivoro', label: 'Omnívoro' },
        { value: 'vegano', label: 'Vegano' },
        { value: 'keto', label: 'Keto' },
        { value: 'paleo', label: 'Paleo' },
    ];

    /** Available allergy options */
    readonly allergyOptions = [
        { value: 'nueces', label: 'Nueces' },
        { value: 'gluten', label: 'Gluten' },
        { value: 'lactosa', label: 'Lactosa' },
        { value: 'huevo', label: 'Huevo' },
        { value: 'soja', label: 'Soja' },
    ];

    constructor(
        private readonly fb: FormBuilder,
        public readonly userService: UserService
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    /**
     * Initialize form with current profile data
     */
    private initForm(): void {
        const profile = this.userService.profile();

        this.profileForm = this.fb.group({
            name: [profile.name, [Validators.required, Validators.minLength(2)]],
            diet: [profile.diet, Validators.required],
            allergies: this.fb.group(
                this.allergyOptions.reduce((acc, option) => {
                    acc[option.value] = [profile.allergies.includes(option.value)];
                    return acc;
                }, {} as Record<string, boolean[]>)
            ),
        });
    }

    /**
     * Save profile
     */
    onSave(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        try {
            const formValue = this.profileForm.value;
            const allergies = Object.keys(formValue.allergies).filter(
                (key) => formValue.allergies[key]
            );

            this.userService.saveProfile({
                name: formValue.name,
                diet: formValue.diet,
                allergies,
            });

            this.saveSuccess = true;
            this.saveError = false;

            // Hide success message after 3s
            setTimeout(() => {
                this.saveSuccess = false;
            }, 3000);
        } catch (error) {
            this.saveError = true;
            this.saveSuccess = false;
        }
    }

    /**
     * Reset form to current saved profile
     */
    onReset(): void {
        this.initForm();
        this.saveSuccess = false;
        this.saveError = false;
    }
}

"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buyerCreateSchema } from "@/lib/validation";
import type { z } from "zod";

type BuyerForm = z.infer<typeof buyerCreateSchema>;

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUpdatedAt, setEditingUpdatedAt] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BuyerForm>({
    resolver: zodResolver(buyerCreateSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      email: undefined,
      city: "Mohali",
      propertyType: "Apartment",
      bhk: undefined,
      purpose: "Buy",
      budgetMin: undefined,
      budgetMax: undefined,
      timeline: "Exploring",
      source: "Website",
      notes: undefined,
      tags: [],
    },
  });

  useEffect(() => { fetchBuyers(); }, []);

  async function fetchBuyers() {
    const res = await fetch("/api/buyers");
    const data = await res.json();
    setBuyers(data);
  }

  async function onSubmit(values: any) {
    setServerError(null);
    // ensure tags format: allow user to pass array or comma string
    const payload = {
      ...values,
      tags: Array.isArray(values.tags) ? values.tags : (typeof values.tags === "string" ? values.tags.split(",").map((s: string)=> s.trim()).filter(Boolean) : []),
    };

    try {
      if (editingId) {
        // include updatedAt for concurrency
        await fetch(`/api/buyers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, updatedAt: editingUpdatedAt }),
        });
        setEditingId(null);
        setEditingUpdatedAt(null);
      } else {
        await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      reset();
      fetchBuyers();
    } catch (err: any) {
      setServerError("Network or server error");
      console.error(err);
    }
  }

  async function handleEditClick(id: string) {
    const res = await fetch(`/api/buyers/${id}`);
    if (!res.ok) return;
    const buyer = await res.json();
    // buyer.tags stored as CSV string in DB — convert to array
    const tagsArray = buyer.tags ? buyer.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    // set form values
    setValue("fullName", buyer.fullName);
    setValue("phone", buyer.phone);
    setValue("email", buyer.email ?? undefined);
    setValue("city", buyer.city);
    setValue("propertyType", buyer.propertyType);
    setValue("bhk", buyer.bhk ?? undefined);
    setValue("purpose", buyer.purpose);
    setValue("budgetMin", buyer.budgetMin ?? undefined);
    setValue("budgetMax", buyer.budgetMax ?? undefined);
    setValue("timeline", buyer.timeline);
    setValue("source", buyer.source);
    setValue("notes", buyer.notes ?? undefined);
    setValue("tags", tagsArray);
    setEditingId(id);
    setEditingUpdatedAt(buyer.updatedAt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/buyers/${id}`, { method: "DELETE" });
    fetchBuyers();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{editingId ? "Edit Buyer" : "Add Buyer"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white shadow p-4 rounded">
        <div>
          <label className="block">Full Name</label>
          <input {...register("fullName")} className="border p-2 w-full" />
          {errors.fullName && <div role="alert" className="text-red-600">{errors.fullName.message}</div>}
        </div>

        <div>
          <label className="block">Phone</label>
          <input {...register("phone")} className="border p-2 w-full" />
          {errors.phone && <div role="alert" className="text-red-600">{errors.phone.message}</div>}
        </div>

        <div>
          <label className="block">Email (optional)</label>
          <input {...register("email")} className="border p-2 w-full" />
          {errors.email && <div role="alert" className="text-red-600">{errors.email.message}</div>}
        </div>

        <div>
          <label className="block">City</label>
          <select {...register("city")} className="border p-2 w-full">
            <option>Chandigarh</option>
            <option>Mohali</option>
            <option>Zirakpur</option>
            <option>Panchkula</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block">Property Type</label>
          <select {...register("propertyType")} className="border p-2 w-full">
            <option>Apartment</option>
            <option>Villa</option>
            <option>Plot</option>
            <option>Office</option>
            <option>Retail</option>
          </select>
        </div>

        {/* Conditionally required bhk — keep a text select */
        }
        <div>
          <label className="block">BHK (if Apartment/Villa)</label>
          <select {...register("bhk")} className="border p-2 w-full">
            <option value="">—</option>
            <option>Studio</option>
            <option>One</option>
            <option>Two</option>
            <option>Three</option>
            <option>Four</option>
          </select>
          {errors.bhk && <div role="alert" className="text-red-600">{errors.bhk.message}</div>}
        </div>

        <div>
          <label className="block">Purpose</label>
          <select {...register("purpose")} className="border p-2 w-full">
            <option>Buy</option>
            <option>Rent</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label>Budget Min (INR)</label>
            <input type="number" {...register("budgetMin", { valueAsNumber: true })} className="border p-2 w-full" />
          </div>
          <div className="flex-1">
            <label>Budget Max (INR)</label>
            <input type="number" {...register("budgetMax", { valueAsNumber: true })} className="border p-2 w-full" />
            {errors.budgetMax && <div role="alert" className="text-red-600">{errors.budgetMax.message}</div>}
          </div>
        </div>

        <div>
          <label>Timeline</label>
          <select {...register("timeline")} className="border p-2 w-full">
            <option>Exploring</option>
            <option>Within_0_3m</option>
            <option>Within_3_6m</option>
            <option>MoreThan6m</option>
          </select>
        </div>

        <div>
          <label>Source</label>
          <select {...register("source")} className="border p-2 w-full">
            <option>Website</option>
            <option>Referral</option>
            <option>Walk-in</option>
            <option>Call</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label>Notes</label>
          <textarea {...register("notes")} className="border p-2 w-full" />
        </div>

        <div>
          <label>Tags (comma separated)</label>
          <input
            type="text"
            {...register("tags" as any)} // we accept array but RHF binding is easier as string; conversion handled in submit
            className="border p-2 w-full"
            placeholder="e.g. urgent, investor"
            onChange={(e) => {
              // set tags as array in form state
              const val = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
              setValue("tags" as any, val as any);
            }}
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? "Update Buyer" : "Add Buyer"}
          </button>
          {editingId && <button type="button" onClick={() => { reset(); setEditingId(null); setEditingUpdatedAt(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>}
        </div>
      </form>

      {serverError && <div role="alert" className="text-red-600 mt-4">{serverError}</div>}

      <h2 className="text-xl mt-6">Buyer List</h2>
      <ul className="space-y-3 mt-2">
        {buyers.map((b) => (
          <li key={b.id} className="border p-3 rounded flex justify-between">
            <div>
              <div className="font-medium">{b.fullName}</div>
              <div className="text-sm">{b.phone} ({b.city})</div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => handleEditClick(b.id)} className="text-blue-600">Edit</button>
              <button onClick={() => handleDelete(b.id)} className="text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
